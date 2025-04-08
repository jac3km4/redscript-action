process.env["INPUT_SOURCE"] = "D:\\Games\\Cyberpunk 2077\\r6\\scripts";
process.env["INPUT_LINT"] = "true";
process.env["INPUT_CHECK-FORMAT"] = "true";
process.env["INPUT_VERSION"] = "1.0.0-preview.10";

require("./dist/index.js");
