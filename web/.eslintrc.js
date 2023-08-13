module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": [],
    "overrides": [
        {
            "env": {
                "node": true
            },
            "files": [
                ".eslintrc.{js,cjs}"
            ],
            "parserOptions": {
                "sourceType": "script"
            }
        }
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module",
        "project": "./tsconfig.json"
    },
    "plugins": [
        "@typescript-eslint",
        "deprecation"
    ],
    "rules": {
        "deprecation/deprecation": "warn"
    }
}
