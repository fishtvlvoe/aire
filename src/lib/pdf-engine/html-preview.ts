const PREVIEW_STYLE = `
body { background: #f1f5f9 !important; padding: 16px 0 !important; }
.page { margin: 0 auto 16px auto !important; box-shadow: 0 1px 4px rgba(15, 23, 42, 0.12); }
`;

export function toIframePreviewHtml(html: string): string {
  if (!html.includes("</style>")) {
    return html;
  }

  return html.replace("</style>", `${PREVIEW_STYLE}</style>`);
}
