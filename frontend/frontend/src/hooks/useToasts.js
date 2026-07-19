import { useCallback, useMemo, useRef, useState } from "react";

export default function useToasts() {
  const [toasts, setToasts] = useState([]);
  const seq = useRef(1);

  const pushToast = useCallback((t) => {
    const id = seq.current++;
    setToasts((prev) => [...prev, { id, duration: 4500, ...t }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const activeToast = toasts.length ? toasts[toasts.length - 1] : null;

  return useMemo(() => ({
    pushToast,
    removeToast,
    activeToast,
  }), [pushToast, removeToast, activeToast]);
}

