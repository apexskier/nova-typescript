console.log(__filename);
console.log(process.env);

console.log(process.argv);

process.stdin.on("data", function (chunk) {
  const line = chunk.toString().split(/\n(.+)/);
  const [cl, raw] = line;
  const length = Number(cl.match(/Content-Length: (\d+)/i)[1]);
  if (raw.length == length) {
    const command = JSON.parse(raw);
    console.log(command);
  } else {
    throw new Error("not handling long commands yet");
  }
});
