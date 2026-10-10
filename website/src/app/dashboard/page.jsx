import initPocketBase from "@/lib/initPocketBase";
import CompanyList from "@/components/company_list";
import CompanyListSkele from "@/components/company_list_skele";
import {Suspense} from "react";
import UserInfoSkele from "@/components/user_info_skele";
import UserInfo from "@/components/user_info";

export default function DashboardPage() {

    return (
        <div>
            <div className="flex flex-row">
                <div className="">
                    <Suspense fallback={<UserInfoSkele/>}>
                        <UserInfo/>
                    </Suspense>
                </div>
            </div>
            <Suspense fallback={<CompanyListSkele/>}>
                <CompanyList/>
            </Suspense>
        </div>
    )
}