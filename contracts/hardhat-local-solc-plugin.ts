import type { HardhatPlugin } from "hardhat/types/plugins";

const hardhatLocalSolcPlugin: HardhatPlugin = {
  id: "local:solc-no-download",
  hookHandlers: {
    solidity: () => import("./hardhat-local-solc-hooks"),
  },
};

export default hardhatLocalSolcPlugin;