import {CompanyList} from "@/components/company_list";
import UserInfo from "@/components/user_info";
import EventScroller from "@/components/event_scroller";
import LatestNews from "@/components/latest_news";

export default function DashboardPage() {

    return (
        <div className="m-3">
            <EventScroller/>
            <div className="bordered_div mt-3">
                <UserInfo/>
                <LatestNews/>
                <CompanyList/>
            </div>
        </div>
    )
}