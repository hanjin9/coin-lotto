// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * WLD Lotto Drawing Contract
 * 
 * 기능:
 * 1. 추첨 결과 온체인 기록 (recordDraw)
 * 2. 당첨자 검증 (verifyWinner)
 * 3. 상금 청구 (claimPrize)
 * 4. 추첨 결과 조회 (getDrawResult)
 */

contract LottoDrawing {
    // 추첨 결과 구조체
    struct DrawResult {
        uint256 drawId;
        uint256[] winningNumbers;
        address[] winners;
        uint256[] prizes;
        uint256 timestamp;
        uint256 blockNumber;
        bool recorded;
    }

    // 당첨자 정보 구조체
    struct Winner {
        address walletAddress;
        uint256 matchedNumbers;
        uint256 prizeAmount;
        bool claimed;
        uint256 claimedAt;
    }

    // 상태 변수
    mapping(uint256 => DrawResult) public draws;
    mapping(uint256 => mapping(address => Winner)) public winners;
    mapping(address => uint256) public balances;

    uint256 public totalDraws = 0;
    address public owner;

    // 이벤트
    event DrawRecorded(
        uint256 indexed drawId,
        uint256[] winningNumbers,
        uint256 winnerCount,
        uint256 totalPrize
    );

    event WinnerVerified(
        uint256 indexed drawId,
        address indexed winner,
        uint256 matchedNumbers,
        uint256 prizeAmount
    );

    event PrizeClaimed(
        uint256 indexed drawId,
        address indexed winner,
        uint256 prizeAmount
    );

    // 생성자
    constructor() {
        owner = msg.sender;
    }

    // 접근 제어
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    /**
     * 추첨 결과 온체인 기록
     */
    function recordDraw(
        uint256 drawId,
        uint256[] calldata winningNumbers,
        address[] calldata winnerAddresses,
        uint256[] calldata prizeAmounts
    ) external onlyOwner {
        require(winningNumbers.length == 6, "Must have 6 winning numbers");
        require(
            winnerAddresses.length == prizeAmounts.length,
            "Winners and prizes length mismatch"
        );

        // 당첨번호 중복 확인
        for (uint256 i = 0; i < winningNumbers.length; i++) {
            require(
                winningNumbers[i] >= 1 && winningNumbers[i] <= 45,
                "Number must be between 1 and 45"
            );
            for (uint256 j = i + 1; j < winningNumbers.length; j++) {
                require(
                    winningNumbers[i] != winningNumbers[j],
                    "Duplicate numbers not allowed"
                );
            }
        }

        // 추첨 결과 저장
        draws[drawId] = DrawResult({
            drawId: drawId,
            winningNumbers: winningNumbers,
            winners: winnerAddresses,
            prizes: prizeAmounts,
            timestamp: block.timestamp,
            blockNumber: block.number,
            recorded: true
        });

        // 당첨자 정보 저장
        uint256 totalPrize = 0;
        for (uint256 i = 0; i < winnerAddresses.length; i++) {
            winners[drawId][winnerAddresses[i]] = Winner({
                walletAddress: winnerAddresses[i],
                matchedNumbers: 6, // 실제: 매칭 번호 개수
                prizeAmount: prizeAmounts[i],
                claimed: false,
                claimedAt: 0
            });
            totalPrize += prizeAmounts[i];
        }

        totalDraws++;

        // 이벤트 발생
        emit DrawRecorded(
            drawId,
            winningNumbers,
            winnerAddresses.length,
            totalPrize
        );
    }

    /**
     * 당첨자 검증
     */
    function verifyWinner(
        uint256 drawId,
        address winnerAddress
    ) external view returns (bool isWinner, uint256 prizeAmount) {
        require(draws[drawId].recorded, "Draw not found");

        Winner memory winner = winners[drawId][winnerAddress];

        if (winner.prizeAmount > 0) {
            return (true, winner.prizeAmount);
        }

        return (false, 0);
    }

    /**
     * 상금 청구
     */
    function claimPrize(
        uint256 drawId,
        address winnerAddress
    ) external payable returns (bool) {
        require(draws[drawId].recorded, "Draw not found");

        Winner storage winner = winners[drawId][winnerAddress];
        require(winner.prizeAmount > 0, "No prize for this address");
        require(!winner.claimed, "Prize already claimed");

        // 상금 청구 처리
        winner.claimed = true;
        winner.claimedAt = block.timestamp;
        balances[winnerAddress] += winner.prizeAmount;

        // 이벤트 발생
        emit PrizeClaimed(drawId, winnerAddress, winner.prizeAmount);

        return true;
    }

    /**
     * 추첨 결과 조회
     */
    function getDrawResult(
        uint256 drawId
    )
        external
        view
        returns (
            uint256[] memory winningNumbers,
            uint256 winnerCount,
            uint256 totalPrize,
            uint256 blockNumber
        )
    {
        require(draws[drawId].recorded, "Draw not found");

        DrawResult memory draw = draws[drawId];

        uint256 totalPrizeAmount = 0;
        for (uint256 i = 0; i < draw.prizes.length; i++) {
            totalPrizeAmount += draw.prizes[i];
        }

        return (
            draw.winningNumbers,
            draw.winners.length,
            totalPrizeAmount,
            draw.blockNumber
        );
    }

    /**
     * 당첨자 목록 조회
     */
    function getWinners(
        uint256 drawId
    ) external view returns (address[] memory) {
        require(draws[drawId].recorded, "Draw not found");
        return draws[drawId].winners;
    }

    /**
     * 당첨자 정보 조회
     */
    function getWinnerInfo(
        uint256 drawId,
        address winnerAddress
    )
        external
        view
        returns (
            uint256 matchedNumbers,
            uint256 prizeAmount,
            bool claimed,
            uint256 claimedAt
        )
    {
        Winner memory winner = winners[drawId][winnerAddress];
        return (
            winner.matchedNumbers,
            winner.prizeAmount,
            winner.claimed,
            winner.claimedAt
        );
    }

    /**
     * 사용자 잔액 조회
     */
    function getBalance(address user) external view returns (uint256) {
        return balances[user];
    }

    /**
     * 상금 인출
     */
    function withdrawPrize() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No balance to withdraw");

        balances[msg.sender] = 0;

        // 실제: 지갑으로 전송
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Withdrawal failed");
    }

    /**
     * 컨트랙트 잔액 조회
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * Ether 수신
     */
    receive() external payable {}
}
