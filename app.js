const express = require('express');
const app = express();
const ejs = require('ejs');
const path = require('path');
const { 
    addTokenReceiver, 
    addAccount,
    addQuantity,
    getInfoProgram,
    swapLamports
} = require("./solana");

app.engine('ejs', ejs.__express);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const port = process.env.PORT || 8000;

app.get('/', function (req, res) {
    const response = getInfoProgram();
    res.render('index', response);
});

app.post('/add_token', function (req, res) {
    const token_address = req.body.token_address;
    if (token_address) {
        addTokenReceiver(token_address);
        const response = getInfoProgram();
        return res.render('index', response);
    }
    return res.send("Token added not successfully");
});

app.post('/add_quantity', function (req, res) {
    const quantity = req.body.quantity;
    if (quantity) {
        addQuantity(quantity);
        const response = getInfoProgram();
        return res.render('index', response);
    }
    return res.send("Quantity added not successfully");
});

app.post('/add_wallet', function (req, res) {
    const name = req.body.name;
    const privateKey = req.body.private_key;
    if (privateKey) {
        addAccount(privateKey, name);
        const response = getInfoProgram();
        return res.render('index', response);
    }
    return res.send("Token added not successfully");
});

app.get('/run', async function (req, res) {
    console.log('Running a task swap lamports...');
    await swapLamports();
    const response = getInfoProgram();
    return res.render('index', response);
});


app.listen(port, function () {
    console.log("Server is running on port " + port);
});
