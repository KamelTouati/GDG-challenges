// I try to submit the secret value to the smart contract.
// This will show him that the smart contract is vulnerable and that anyone can access the secret value if they know it.

// However, it is important to note that submitting the secret value will also make it public
// so anyone will be able to access it. This could have negative consequences for my friend
// submit the secret value using the web3.js library:

const web3 = require("web3");

const contractAddress =
  "0x31e297602c7bd8efbb7cfac5c52483d352c565211b2de826f454001d935e1239";

const contract = new web3.eth.Contract(contractAbi, contractAddress);

const secretValue = "my secret value";

contract.methods.submitSecretValue(secretValue).send();
