const express = require('express');

const app = express();

app.get('/', (req,res) => res.send('API RUNNING'));

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => console.log(`Server up and running in PORT : ${PORT}`));