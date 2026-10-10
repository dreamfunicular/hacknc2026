import {initPocketBase} from "@/lib/initPocketBase";
import CompanyList from "@/components/company_list";
import CompanyListSkele from "@/components/company_list_skele";
import {Suspense} from "react";
import UserInfoSkele from "@/components/user_info_skele";
import UserInfo from "@/components/user_info";

export default function DashboardPage() {

    return (
        <div className="w-screen h-screen">
            <div className="flex flex-row h-2/3">
                <div className="w-1/2">
                    <UserInfo/>
                </div>
            </div>
            <Suspense fallback={<CompanyListSkele/>}>
                <CompanyList/>
            </Suspense>
        </div>
    )
}