const test = require("node:test");
const assert = require("node:assert/strict");
const app = require("../server");

test("GET / returns running status", async () => {
  const server = app.listen(0);

  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/`);
    const data = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(data, { message: "API is running" });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
