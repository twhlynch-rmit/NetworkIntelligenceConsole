FROM node:25-alpine

WORKDIR /app

COPY package.json ./

CMD ["node", "-e", "require('http').createServer((req,res)=>{res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({status:'ok'}))}).listen(3000,'0.0.0.0')"]
