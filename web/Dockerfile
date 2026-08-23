FROM node:25-alpine

WORKDIR /app

CMD ["node", "-e", "require('http').createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/plain'});res.end('Network Intelligence Console')}).listen(5173,'0.0.0.0')"]
