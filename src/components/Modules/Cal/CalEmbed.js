import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";

export default function CalEmbed() {
    useEffect(() => {
        (async function () {
            const cal = await getCalApi({ "namespace": "sayhi" });
            cal("ui", { "theme": "dark", "cssVarsPerTheme": { "light": { "cal-brand": "#101010" }, "dark": { "cal-brand": "#ffa3a3" } }, "hideEventTypeDetails": false, "layout": "month_view" });
        })();
    }, [])
    return <Cal namespace="sayhi"
        calLink="ujjwalvivek/sayhi"
        style={{ width: "50%", height: "50%", overflow: "scroll" }}
        config={{ "layout": "month_view", "useSlotsViewOnSmallScreen": "true", "theme": "dark" }}
    />;
};