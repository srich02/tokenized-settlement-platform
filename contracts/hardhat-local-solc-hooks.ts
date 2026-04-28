import type { SolidityHooks } from "hardhat/types/hooks";

import { pathToFileURL } from "node:url";

import { HardhatError } from "@nomicfoundation/hardhat-errors";

import { SolcJsCompiler } from "hardhat/internal/builtin-plugins/solidity/build-system/compiler/compiler.js";
import wrapper from "hardhat/internal/builtin-plugins/solidity/build-system/compiler/solcjs-wrapper.js";

const LOCAL_SOLC_TYPE = "local-solc";

export default async (): Promise<Partial<SolidityHooks>> => ({
  downloadCompilers: async () => {
    // The local-solc compiler type never downloads compiler metadata.
  },
  getCompiler: async (context, compilerConfig, next) => {
    if (compilerConfig.type !== LOCAL_SOLC_TYPE) {
      return next(context, compilerConfig);
    }

    if (compilerConfig.path === undefined) {
      throw new HardhatError(
        HardhatError.ERRORS.CORE.SOLIDITY.COMPILER_PATH_DOES_NOT_EXIST,
        {
          compilerPath: "undefined",
          version: compilerConfig.version,
        },
      );
    }

    const solcModule = (await import(pathToFileURL(compilerConfig.path).toString()))
      .default;
    const { version } = wrapper(solcModule);
    const longVersion = version();

    return new SolcJsCompiler(
      compilerConfig.version,
      longVersion,
      compilerConfig.path,
    );
  },
});