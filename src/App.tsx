import "react";
import Table from "./Table";
import { Analytics } from "@vercel/analytics/react";

function App() {
  return (
    <>
      <Table />
      <Analytics />
    </>
  );
}

export default App;
