const anchor = require("@project-serum/anchor");
const { SystemProgram } = anchor.web3;

const main = async () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
    const program = anchor.workspace.SolanaGifs;
    const baseAccount = anchor.web3.Keypair.generate();

    let tx = await program.rpc.startStuffOff({
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [baseAccount]
    });

    console.log("Your transaction signature", tx);

    let account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    console.log("GIF Count", account.totalGifs.toString());

    await program.rpc.addGifs("https://media.giphy.com/media/b8RfbQFaOs1rO10ren/giphy.gif", {
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
      },
    });

    account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    console.log("GIF Count", account.totalGifs.toString());
    console.log("GIF List =>>", account.gifList, "new")
}

const runMain = async() => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

runMain();