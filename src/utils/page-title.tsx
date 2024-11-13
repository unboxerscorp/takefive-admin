import React from "react";

export default function PageTitle({ title }: { title: string }) {
    const [currentTime, setCurrentTime] = React.useState(new Date());

    const updateClock = React.useCallback(() => {
        setCurrentTime(new Date());
        requestAnimationFrame(updateClock);
    }, []);

    React.useEffect(() => {
        const id = requestAnimationFrame(updateClock);
        return () => cancelAnimationFrame(id); // 컴포넌트 언마운트 시 타이머 정리
    }, [updateClock]);

    return (
        <span style={{ display: "flex", columnGap: "1rem", alignItems: "center" }}>
            <h1 style={{ textAlign: "center", fontWeight: "bold", fontSize: "1.5rem", color: "black" }}>{title}</h1>
            <span style={{ color: "gray", fontWeight: "bold" }}>{currentTime.toLocaleString("ko-KR")}</span>
        </span>
    )
}