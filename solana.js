const { Connection, Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction, PublicKey } = require("@solana/web3.js");
const bs58 = require("bs58");
const cron = require('node-cron');

const rpcNode = process.env.RPC_NODE || "https://api.testnet.solana.com";
let quantity = parseFloat(process.env.QUANTITY_OF_SOL_TO_SEND) || 0.1;
const connection = new Connection(rpcNode);

let receiverPublicKey;
const accounts = [];
let address = process.env.ADDRESS_RECEIVER || '';

function getInfoProgram() {
    return { accounts: accounts, token_address: address, quantity: quantity };
}

function addAccount(privateKey, accountName) {
    accounts.push({
        privateKey,
        accountName,
    });
}

function addQuantity(_quantity) {
    quantity = parseFloat(_quantity);
}

function addTokenReceiver(_address) {
    address = _address;
    receiverPublicKey = new PublicKey(address); // SOL address 
}

// Create Keypair for wallet
async function getBalance(wallet) {
    const balance = await connection.getBalance(wallet.publicKey);
    console.log(`Sender Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    return balance / LAMPORTS_PER_SOL;
}

// convert time using site: https://crontab.guru/
cron.schedule('0 * * * *', async () => {
    console.log('Running a task every hour ...');
    await swapLamports();
});

function keypair(privateKey) {
    return Keypair.fromSecretKey(Uint8Array.from(bs58.decode(privateKey)));
}

async function swapLamports() {
    const promises = accounts.map(async (account) => {
        if (account.privateKey && receiverPublicKey) {
            const wallet = keypair(account.privateKey);
            const balance = await getBalance(wallet);
            account.balance = balance;
            try {
                let transaction;
                // send token to address
                if (balance > 0) {
                    transaction = new Transaction().add(
                        SystemProgram.transfer({
                            fromPubkey: wallet.publicKey,
                            toPubkey: receiverPublicKey,
                            lamports: quantity * LAMPORTS_PER_SOL,
                        })
                    );
                    transaction.feePayer = wallet.publicKey;
                    const transactionHash = await connection.sendTransaction(transaction, [wallet]);
    
                    console.log(`Transaction Hash: ${transactionHash}`);
                    account.transactionHash = transactionHash;
                    account.status = "OK";
                }
            } catch (error) {
                console.error('Error occurred for account:', account.name, error);
                account.status = "Error";
            }
        }
    });
    await Promise.all(promises);
}


module.exports = {
    addAccount,
    addQuantity,
    addTokenReceiver,
    getInfoProgram,
    swapLamports
}