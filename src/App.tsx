import { useMemo } from "react";
import { YadaButton } from "./components/YadaButton.tsx";
import { YadaCanvas } from "./components/YadaCanvas.tsx";
import { useYadaSync } from "./hooks/useYadaSync.ts";
import { getUserId } from "./lib/userId.ts";

export function App() {
  const userId = useMemo(() => getUserId(), []);
  const { totalCount, userCount, newCount, increment } = useYadaSync(userId);

  return (
    <>
      <YadaCanvas existingCount={totalCount - newCount} newCount={newCount} />
      <div id="layout">
        <header>
          <p>
            {userCount}人が{totalCount}回やだと思っています
          </p>
          <p>
            <small>（無料分が一瞬で溶けたのでカウント保存は停止中）</small>
          </p>
        </header>
        <main>
          <YadaButton onClick={increment} />
        </main>
      </div>
    </>
  );
}
