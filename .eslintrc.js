module.exports = {
    "env": {
        "es6": true,
        "node": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 2018
    },
    "rules": {
        "indent": [
            "error",
            4
        ],
        "linebreak-style": [
            "error",
            "windows"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ],
        "prefer-arrow-callback": [
            "error",
            { "allowNamedFunctions": true }
        ],
        "no-console": "off",
        "no-var": "error",
        "no-const-assign": "error",
        "new-parens": "error",
        "prefer-const": "warn"
    }
};