import ReportPieChartComponent from "../components/ReportPieChartComponent";
import ReplySatisfactionPoints from "../components/ReplySatisfactionPoints";
import Space from "tdesign-react/es/space/Space";
import { Divider, Loading } from "tdesign-react";
import BarChart from "../components/ReportBarChart";

const ReviewReport = ({ taskId, commentList, commentsTotal, PieData, pieDataLoading, setChartOptions }) => {

    return (
        <Space direction="vertical" style={{ width: '80vw' }}>
            <Loading loading={pieDataLoading} text="拼命加载中..." size="small">
                <ReportPieChartComponent commentList={commentList} commentsTotal={commentsTotal} taskId={taskId} PieDataList={PieData} setChartOptions={setChartOptions} />
            </Loading>
            <Divider />
            <BarChart commentList={commentList} commentsTotal={commentsTotal} taskId={taskId} />
            <Divider />
            <ReplySatisfactionPoints taskId={taskId} />
        </Space>
    );
}
export default ReviewReport;