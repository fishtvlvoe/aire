// AIRE ESLint flat config
// 目的：限制 icon library 來源，統一使用 lucide-react
//
// 註：禁 emoji 規則未實作（會卡住正常開發），改用 README/CLAUDE.md 提醒。

const config = [
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react-icons",
              message: "AIRE 統一使用 lucide-react，禁止 react-icons。",
            },
            {
              name: "@heroicons/react",
              message: "AIRE 統一使用 lucide-react，禁止 @heroicons/react。",
            },
          ],
          patterns: [
            {
              group: ["react-icons/*", "@heroicons/react/*"],
              message: "AIRE 統一使用 lucide-react。",
            },
          ],
        },
      ],
    },
  },
  {
    // 排除 build 產物
    ignores: ["node_modules/**", ".next/**", "out/**", "src-tauri/**", "legacy/**"],
  },
];

export default config;
