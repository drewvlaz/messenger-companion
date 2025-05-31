import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import _import from 'eslint-plugin-import';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default [
    ...compat.extends('eslint:recommended', 'plugin:eslint-comments/recommended'),
    {
        "rules": {
            "padding-line-between-statements": [
                "error",
                { "blankLine": "always", "prev": "block", "next": "*" },
                { "blankLine": "always", "prev": "*", "next": "return" }
            ]
        }
    }
]
