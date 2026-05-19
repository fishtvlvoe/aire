use serde_json::Value;

fn escape_xml_text(input: &str) -> String {
    // Minimal XML escaping for text nodes.
    let mut out = String::with_capacity(input.len());
    for ch in input.chars() {
        match ch {
            '&' => out.push_str("&amp;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            '"' => out.push_str("&quot;"),
            '\'' => out.push_str("&apos;"),
            _ => out.push(ch),
        }
    }
    out
}

/// Deterministically renders a simple black-and-white SVG floor plan.
///
/// Input shape (simplified): { "rooms": [{"label": "..."}, ...] }
///
/// Layout rules (deterministic):
/// - 2 columns
/// - each room is 80x60
/// - position = (col * 100 + 10, row * 80 + 10)
///
/// If dimensions are not verified, the SVG must include a disclaimer and must not show any
/// dimension numbers.
pub fn render_to_svg(extracted_json: &str, dimensions_verified: bool) -> Result<String, String> {
    let v: Value = serde_json::from_str(extracted_json)
        .map_err(|e| format!("parse_error: invalid JSON: {e}"))?;

    let rooms = v
        .get("rooms")
        .and_then(|x| x.as_array())
        .ok_or_else(|| "invalid_shape: missing rooms[]".to_string())?;

    let room_count = rooms.len();
    let cols: usize = 2;
    let rows: usize = if room_count == 0 {
        0
    } else {
        (room_count + cols - 1) / cols
    };

    let width: i32 = (cols as i32) * 100;
    let height: i32 = (rows as i32) * 80;

    let mut svg = String::new();
    svg.push_str(&format!(
        "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"{width}\" height=\"{height}\" viewBox=\"0 0 {width} {height}\">",
    ));

    for (i, room) in rooms.iter().enumerate() {
        let label = room
            .get("label")
            .and_then(|x| x.as_str())
            .unwrap_or("");
        let label = escape_xml_text(label);

        let dimensions_text = room
            .get("dimensions_text")
            .and_then(|x| x.as_str())
            .map(str::trim)
            .filter(|s| !s.is_empty());

        let col = (i % cols) as i32;
        let row = (i / cols) as i32;
        let x = col * 100 + 10;
        let y = row * 80 + 10;

        svg.push_str(&format!(
            "<rect x=\"{x}\" y=\"{y}\" width=\"80\" height=\"60\" fill=\"white\" stroke=\"black\" stroke-width=\"1\"/>"
        ));

        let tx = x + 40;
        let ty = y + 30;
        svg.push_str(&format!(
            "<text x=\"{tx}\" y=\"{ty}\" text-anchor=\"middle\" dominant-baseline=\"middle\" font-size=\"12\" fill=\"black\" font-family=\"sans-serif\">{label}</text>"
        ));

        // Only render dimension-related text if dimensions are verified.
        if dimensions_verified {
            if let Some(dim) = dimensions_text {
                let dim = escape_xml_text(dim);
                let dim_y = ty + 14;
                svg.push_str(&format!(
                    "<text x=\"{tx}\" y=\"{dim_y}\" text-anchor=\"middle\" dominant-baseline=\"middle\" font-size=\"9\" fill=\"#333\" font-family=\"sans-serif\">{dim}</text>"
                ));
            }
        }
    }

    if !dimensions_verified {
        let disclaimer_y = (height - 10).max(0);
        svg.push_str(&format!(
            "<text x=\"10\" y=\"{disclaimer_y}\" font-size=\"9\" fill=\"#666\">本圖未包含實際尺寸，僅供空間配置參考</text>"
        ));
    }

    svg.push_str("</svg>");

    Ok(svg)
}

#[cfg(test)]
mod tests {
    const MOCK_JSON_2_ROOMS: &str = r#"{"sketch_id":"s1","rooms":[{"id":"r1","label":"客廳","room_type":"living","confidence":0.9},{"id":"r2","label":"臥室","room_type":"bedroom","confidence":0.9}],"openings":[],"adjacency":[],"uncertainty":[]}"#;

    const MOCK_JSON_WITH_DIMS: &str = r#"{"sketch_id":"s1","rooms":[{"id":"r1","label":"客廳","room_type":"living","confidence":0.9,"dimensions_text":"3mx4m"}],"openings":[],"adjacency":[],"uncertainty":[]}"#;

    #[test]
    fn same_json_produces_same_svg() {
        let svg1 = super::render_to_svg(MOCK_JSON_2_ROOMS, false).unwrap();
        let svg2 = super::render_to_svg(MOCK_JSON_2_ROOMS, false).unwrap();
        assert_eq!(svg1, svg2, "同一 JSON 應產出完全相同 SVG");
        // Snapshot: verify key content
        assert!(svg1.contains("客廳"), "SVG should contain room label 客廳");
        assert!(svg1.contains("臥室"), "SVG should contain room label 臥室");
        assert!(svg1.contains("<svg"), "output should be valid SVG");
    }

    #[test]
    fn no_verified_dims_shows_disclaimer() {
        let svg = super::render_to_svg(MOCK_JSON_2_ROOMS, false).unwrap();
        assert!(
            svg.contains("本圖未包含實際尺寸"),
            "SVG should include not-to-scale disclaimer when dimensions are not verified"
        );
    }

    #[test]
    fn verified_dims_no_disclaimer() {
        let svg = super::render_to_svg(MOCK_JSON_2_ROOMS, true).unwrap();
        assert!(
            !svg.contains("本圖未包含實際尺寸"),
            "SVG must not include disclaimer when dimensions are verified"
        );
    }

    #[test]
    fn field_sketch_dims_are_rendered() {
        let svg = super::render_to_svg(MOCK_JSON_WITH_DIMS, true).unwrap();
        assert!(svg.contains("3mx4m"), "SVG should contain provided dimensions_text");
    }

    #[test]
    fn unverified_dims_not_rendered() {
        let svg = super::render_to_svg(MOCK_JSON_WITH_DIMS, false).unwrap();
        assert!(
            !svg.contains("3mx4m"),
            "SVG must not contain dimensions_text when dimensions are not verified"
        );
        assert!(
            svg.contains("本圖未包含實際尺寸"),
            "SVG should include disclaimer when dimensions are not verified"
        );
    }
}
