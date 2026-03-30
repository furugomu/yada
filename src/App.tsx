import { useMemo } from "react";
import { YadaButton } from "./components/YadaButton.tsx";
import { YadaCanvas } from "./components/YadaCanvas.tsx";
import { useYadaSync } from "./hooks/useYadaSync.ts";
import { getUserId } from "./lib/userId.ts";

export function App() {
  const userId = useMemo(() => getUserId(), []);
  const { totalCount, userCount, increment } = useYadaSync(userId);

  return (
    <>
      <YadaCanvas totalCount={totalCount} />
      <div id="layout">
        <header>
          <p>
            {userCount}人が{totalCount}回やだと思っています
          </p>
        </header>
        <main>
          <YadaButton onClick={increment} />
        </main>
      </div>
    </>
  );
}
