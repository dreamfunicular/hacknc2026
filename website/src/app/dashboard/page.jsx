import {CompanyList} from "@/components/company_list";
import UserInfo from "@/components/user_info";

export default function DashboardPage() {

    return (
        <div className="bordered_div mt-3">
            <div className="flex flex-row h-2/3">
                <div className="w-1/2">
                    <UserInfo/>
                </div>
            </div>
            <CompanyList/>
        </div>
    )
}