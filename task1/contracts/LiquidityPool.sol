// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {MyMemeToken} from "./MyMemeToken.sol";

contract LiquidityPool { 

    using Math for uint256;

    MyMemeToken private myMemeToken;

    //此合约的拥有者，暂时认为是管理员
    address public owner;
    // 交易税地址
    address public taxAddress;

    // 最大交易税比例
    uint constant MAX_TAX_RATE = 4;

    // 交易税比例
    uint256 public taxRate;

    struct LPAmount {
        // 流动池ETH持有量
        uint ethLPReserve;

        // 流动池MEME持有量
        uint memeLPReserve;
        // 流动池总份额
        uint totalLPShares;

        mapping(address => uint) lpShares;
    }

    LPAmount private _lpAmount;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function.");
        _;
    }

    constructor(uint _taxRatio, address _taxAddr, address _memeTokenAddr) {
        owner = msg.sender;
        require(_taxRatio <= MAX_TAX_RATE, "Tax ratio is too high.");
        taxAddress = _taxAddr;
        taxRate = _taxRatio;
        myMemeToken = MyMemeToken(_memeTokenAddr);
        require(myMemeToken.getOwner() == owner, "Meme token owner is not contract owner.");
    }

    //初始化流动性池，将部分币加入流动性池，必须提前调用setup
    function initLP() external payable onlyOwner {
        require(_lpAmount.totalLPShares == 0, "LP already initialized");
        addLiquidity(500000 ether);
    }

    // 添加流动性
    function addLiquidity(uint memeAmount) public payable onlyOwner() {
        require(memeAmount > 0 && msg.value > 0, "memeAmount must be greater than 0");
        myMemeToken.transferFrom(msg.sender, address(this), memeAmount);
        uint sharesToAdd;
        if (_lpAmount.totalLPShares == 0) {
            sharesToAdd = Math.sqrt(msg.value * memeAmount);
        } else {
            uint ethShares = (msg.value * _lpAmount.totalLPShares) / _lpAmount.ethLPReserve;
            uint memeShares = (memeAmount * _lpAmount.totalLPShares) / _lpAmount.memeLPReserve;
            sharesToAdd = (ethShares + memeShares) / 2;
        }

        _lpAmount.totalLPShares += sharesToAdd;
        _lpAmount.ethLPReserve += msg.value;
        _lpAmount.memeLPReserve += memeAmount;
        _lpAmount.lpShares[msg.sender] += sharesToAdd;
    }

    // 移除流动性
    function removeLiquidity(uint _shareToRemove) public onlyOwner() {
        require(_shareToRemove <= _lpAmount.lpShares[msg.sender], "Insufficient LP shares");
        uint ethToRemove = (_shareToRemove * _lpAmount.ethLPReserve) / _lpAmount.totalLPShares;
        uint memeToRemove = (_shareToRemove * _lpAmount.memeLPReserve) / _lpAmount.totalLPShares;

        _lpAmount.totalLPShares -= _shareToRemove;
        _lpAmount.ethLPReserve -= ethToRemove;
        _lpAmount.memeLPReserve -= memeToRemove;
        _lpAmount.lpShares[msg.sender] -= _shareToRemove;

        payable(msg.sender).transfer(ethToRemove);
        myMemeToken.transfer(msg.sender, memeToRemove);
    }

    // 购买MEME
    function buyMeme() public payable tradeValidate(msg.value) {
        require(msg.value > 0, "Cannot buy 0 MEME");
        uint newEthReserve = _lpAmount.ethLPReserve + msg.value;
        uint newMemeReserve = _lpAmount.memeLPReserve * _lpAmount.ethLPReserve / newEthReserve;

        uint memeToBuy = _lpAmount.memeLPReserve - newMemeReserve;

        uint fee = memeToBuy * taxRate / 1000;
        uint actualMemeToBuy = memeToBuy - fee;
        require(actualMemeToBuy > 0, "Cannot buy 0 MEME");
        myMemeToken.transfer(msg.sender, actualMemeToBuy);
        _lpAmount.ethLPReserve = newEthReserve;
        _lpAmount.memeLPReserve = newMemeReserve;
        if (fee > 0) {
            myMemeToken.transfer(taxAddress, fee);
        }
        userTradeRecords[msg.sender].push(block.timestamp);
    }

    function lpEthReserve() public view returns (uint) {
        return _lpAmount.ethLPReserve;
    }

    // 卖MEME
    function sellMeme(uint _amount) public tradeValidate(_amount) {
        require(_amount > 0, "Amount must be greater than 0");
        myMemeToken.transferFrom(msg.sender, address(this), _amount);
        uint newMemeReserve = _lpAmount.memeLPReserve + _amount;
        uint newEthReserve = _lpAmount.ethLPReserve * _lpAmount.memeLPReserve / newMemeReserve;
        uint ethToSend = _lpAmount.ethLPReserve - newEthReserve;
        uint fee = ethToSend * taxRate / 1000;
        uint actualEthToSend = ethToSend - fee;
        payable(msg.sender).transfer(actualEthToSend);
        if (fee > 0) {
            payable(taxAddress).transfer(fee);
        }
        userTradeRecords[msg.sender].push(block.timestamp);
    }


    //以下是购买限制校验逻辑

    uint constant MAX_TRADE_AMOUNT = 10 ether;

    mapping (address => uint256[] records) private userTradeRecords;

    modifier tradeValidate(uint _amount) {
        //交易之间必须间隔5分钟
        require(taxAddress != address(0), "taxAddress is not set");
        uint lastTradeTime;
        uint recordSize = userTradeRecords[msg.sender].length;
        if (recordSize > 0) {
            lastTradeTime = userTradeRecords[msg.sender][recordSize - 1];
        }

        if (lastTradeTime > 0 && block.timestamp - lastTradeTime < 5 seconds) {
            revert("Trade too fast");
        }

        require(_amount <= MAX_TRADE_AMOUNT, "Trade amount too large");

        uint recordIndex = recordSize;
        uint todayTradeTimes = 0;
        while (recordIndex >= 1) {
            uint tradeTime = userTradeRecords[msg.sender][recordIndex - 1];
            if (tradeTime >= (block.timestamp - 24 hours)) {
                todayTradeTimes++;
                if (todayTradeTimes >= 10) {
                    revert("Trade too frequently");
                }
            } else {
                break;
            }
            recordIndex--;
         }
        _;
    }

    receive() external payable {
    }
}