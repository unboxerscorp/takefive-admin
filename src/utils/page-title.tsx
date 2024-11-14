import React from "react";

export default function PageTitle({ title }: { title: string }) {
    const [currentTime, setCurrentTime] = React.useState<string | null>(null);

    const updateClock = React.useCallback(() => {
        setCurrentTime(new Date().toLocaleString("ko-KR"));
        requestAnimationFrame(updateClock);
    }, []);

    React.useEffect(() => {
        setCurrentTime(new Date().toLocaleString("ko-KR")); // 클라이언트에서 초기값 설정
        const id = requestAnimationFrame(updateClock);
        return () => cancelAnimationFrame(id);
    }, [updateClock]);

    return (
        <span style={{ display: "flex", columnGap: "1rem", alignItems: "center" }}>
            <h1 style={{ textAlign: "center", fontWeight: "bold", fontSize: "1.5rem", color: "black" }}>{title}</h1>
            <span style={{ color: "gray", fontWeight: "bold" }}>{currentTime}</span>
        </span>
    )
}