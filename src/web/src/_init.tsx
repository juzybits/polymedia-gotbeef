import ReactDOM from "react-dom/client";
import { AppRouter } from "./App";

ReactDOM
    .createRoot( document.getElementById("app") as Element )
    .render(<AppRouter />);
