const net = require("net");
const fs = require("fs");
const zlib = require('zlib');

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const request = data.toString().split(" ");
    const headers = data.toString().split('\r\n');
    if (request[0].startsWith("GET")){
      //handle GET requests
      //set return for ok response with plain text
      const response_ok = 'HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length:';
      if (request[1] == "/"){
        //default request
        socket.write("HTTP/1.1 200 OK\r\n\r\n");
      } else if (request[1].startsWith('/echo/')) {
        //echo requests
        const echo = request[1].slice(6);
        //compress string from echo
        const encoded = zlib.gzipSync(echo);
        const encoded_length = encoded.length;
        console.log(encoded);
        //get encoders
        const encoders = headers[2].slice(headers[2].indexOf(' ') + 1).split(', ');
        var encoding = "";
        if (encoders.includes('gzip')){
          encoding = encoders[encoders.indexOf('gzip')];
        }
        if (encoding == 'gzip') {
          socket.write(`${response_ok} ${encoded_length}\r\nContent-Encoding: ${encoding}\r\n\r\n`);
          socket.write(encoded);
        } else if (encoding !== 'gzip') {
          socket.write(`${response_ok} ${echo.length}\r\n\r\n${echo}`);
        }
        socket.write(`${response_ok} ${echo.length}\r\n\r\n${echo}`);
      } else if (request[1].startsWith('/user-agent')){
        //user agent requests
        const agent = headers[2].split('User-Agent: ')[1];
        socket.write(`${response_ok} ${agent.length}\r\n\r\n${agent}`);
      } else if (request[1].startsWith('/files/')){
        //files requests
        const directory = process.argv[3];
        const file = request[1].split('/files/')[1];
        if (fs.existsSync(`${directory}/${file}`)){
          const file_contents = fs.readFileSync(`${directory}/${file}`).toString();
          socket.write(`HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${file_contents.length}\r\n\r\n${file_contents}`);
        } else {
          socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
        }
      } else {
        //return not found if url not specified as any above request
        socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      }
    } else if (request[0].startsWith("POST")){
      //handle POST requests
      if (request[1].startsWith('/files/')) {
        const directory = process.argv[3];
        const file = request[1].split('/files/')[1];
        const contents = headers[5];
        fs.writeFileSync(`${directory}/${file}`, contents);
        socket.write('HTTP/1.1 201 Created\r\n\r\n');
      }
    }
  });
  socket.on("close", () => {
    socket.end();
  });
});

server.listen(4221, "localhost");
