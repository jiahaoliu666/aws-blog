export var VerificationStep;
(function (VerificationStep) {
    VerificationStep["INITIAL"] = "INITIAL";
    VerificationStep["IDLE"] = "IDLE";
    VerificationStep["STARTED"] = "STARTED";
    VerificationStep["VERIFYING"] = "VERIFYING";
    VerificationStep["COMPLETE"] = "COMPLETE";
    VerificationStep["COMPLETED"] = "COMPLETED";
    VerificationStep["ADD_FRIEND"] = "ADD_FRIEND";
    VerificationStep["VERIFY_CODE"] = "VERIFY_CODE";
    VerificationStep["SCAN_QR"] = "SCAN_QR";
})(VerificationStep || (VerificationStep = {}));
export var VerificationStatus;
(function (VerificationStatus) {
    VerificationStatus["IDLE"] = "IDLE";
    VerificationStatus["PENDING"] = "PENDING";
    VerificationStatus["VALIDATING"] = "VALIDATING";
    VerificationStatus["SUCCESS"] = "SUCCESS";
    VerificationStatus["ERROR"] = "ERROR";
})(VerificationStatus || (VerificationStatus = {}));
export const VERIFICATION_STEPS = [
    {
        number: 1,
        title: '準備開始',
        description: '開始驗證流程'
    },
    {
        number: 2,
        title: '加入好友',
        description: '掃描 QR Code 加入 LINE 好友'
    },
    {
        number: 3,
        title: '驗證確認',
        description: '輸入驗證碼完成驗證'
    }
];
export const VERIFICATION_PROGRESS = {
    INITIAL: 0,
    SCAN_QR: 33,
    ADD_FRIEND: 66,
    VERIFY_CODE: 100
};
//# sourceMappingURL=lineTypes.js.map