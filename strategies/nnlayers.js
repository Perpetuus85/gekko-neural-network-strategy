var log = require('../core/log.js');
var config = require ('../core/util.js').getConfig();

var strategy = {

  init : function() {
    this.name = 'Neural network strategy with layers, stop loss, and take profit';
    this.requiredHistory = config.tradingAdvisor.historySize;

    this.addIndicator('maSlow', 'SMA', this.settings.maSlow);
    this.addIndicator('maFast', 'SMA', this.settings.maFast);
    this.addIndicator('macd', 'MACD', this.settings.macd);
	this.addIndicator('rsi', 'RSI', this.settings.rsi);
    this.market = 'none';
    this.previousAdvice = 'none';
    this.trend = {
	direction: 'none',
	duration: 0,
	persisted: false,
	adviced: false
    };

    this.addIndicator('NN', 'nnlayers', this.settings);
    this.addIndicator('zTrailingStop', 'zTrailingStop', this.settings.stoploss_threshold);
    this.addIndicator('zTakeProfit', 'zTakeProfit', this.settings.takeProfit);
	this.pSlows = [];
	this.pFasts = [];
	this.pSlowWinLength = this.settings.pSlow;
	this.pFastWinLength = this.settings.pFast;
	this.pSlowAge = 0;
	this.pFastAge = 0;
	this.pSlowResult = 0;
	this.pFastResult = 0;
	this.pSlowSum = 0;
	this.pFastSum = 0;
	this.updateSlow = function(predict) {
		let newPredict = predict;
		if(this.pSlows.length >= this.pSlowWinLength) {
			this.pSlows.shift();
		}
		this.pSlows.push(newPredict);
		this.pSlowSum = 0;
		for(let i = 0; i < this.pSlows.length; i++){
			this.pSlowSum += this.pSlows[i];
		}
		this.pSlowResult = this.pSlowSum / this.pSlows.length;
	};
	this.updateFast = function(predict) {
		let newPredict = predict;
		if(this.pFasts.length >= this.pFastWinLength){
			this.pFasts.shift();
		}
		this.pFasts.push(newPredict);
		this.pFastSum = 0;
		for(let i = 0; i < this.pFasts.length; i++){
			this.pFastSum += this.pFasts[i];
		}
		this.pFastResult = this.pFastSum / this.pFasts.length;
	};
	this.predictDiffThreshold = this.settings.diffThreshold;
	this.stoplossWait = this.settings.stoplossWait;
    this.bearProfits = 0;
    this.bullProfits = 0;
    this.bearLosses = 0;
    this.bullLosses = 0;
    this.lastBuyPrice = 0;
    this.isFirstCheck = 1;
	this.lastPrediction = 0;
	this.isCheckingPredictions = false;
    this.waitTime = this.settings.waitTime;
	log.debug(`
		Buy Bear: ${this.settings.threshold_buy_bear} 
		Buy Bull: ${this.settings.threshold_buy_bull}
		Sell Bear: ${this.settings.threshold_sell_bear}
		Sell Bull: ${this.settings.threshold_sell_bull}`);
  },

  update : function(candle)
  {
	if(this.settings.macd.enabled) {
		var macddiff = this.indicators.macd.result;
		if(macddiff > this.settings.macd.thresholds.up) {
			if(this.trend.direction !== 'up'){
				this.trend = {
					duration: 0,
					persisted: false,
					direction: 'up',
					adviced: false
				};
			}
			this.trend.duration++;
			if(this.trend.duration >= this.settings.macd.thresholds.persistence){
				this.trend.persisted = true;
			}
			if(this.trend.persisted && !this.trend.adviced){
				this.trend.adviced = true;
				this.threshold_sell = this.settings.threshold_sell_bull;
				this.threshold_buy = this.settings.threshold_buy_bull;
				this.market = 'bull';
				//this.advice('long');
			} else {
				//this.advice();
			}
		} else if(macddiff < this.settings.macd.thresholds.down) {
			if(this.trend.direction !== 'down'){
				this.trend = {
					duration: 0,
					persisted: false,
					direction: 'down',
					adviced: false
				};
			}
			this.trend.duration++;
			if(this.trend.duration >= this.settings.macd.thresholds.persistence){
				this.trend.persisted = true;
			}
			if(this.trend.persisted && !this.trend.adviced){
				this.trend.adviced = true;
				this.threshold_sell = this.settings.threshold_sell_bear;
				this.threshold_buy = this.settings.threshold_buy_bear;
				this.market = 'bear';
				//this.advice('short');
			} else {
				//this.advice;
			}
		}
	} else if(this.settings.rsi.enabled) {
		var rsi = this.indicators.rsi;
		var rsiVal = rsi.result;
		if(rsiVal > this.settings.rsi.thresholds.high && this.market != 'bear'){
			//new trend detected, incoming bear market
			//RSI shorts here
			this.threshold_sell = this.settings.threshold_sell_bear;
			this.threshold_buy = this.settings.threshold_buy_bear;
			this.market = 'bear';
		} else if(rsiVal < this.settings.rsi.thresholds.low && this.market != 'bull'){
			//new trend detected, incoming bull market
			//RSI longs here
			this.threshold_sell = this.settings.threshold_sell_bull;
			this.threshold_buy = this.settings.threshold_buy_bull;
			this.market = 'bull';
		}
	} else {
		    // set bull / bear thresholds differently
		if(this.indicators.maFast.result > this.indicators.maSlow.result && this.market != 'bull'){
			this.threshold_sell = this.settings.threshold_sell_bull;
			this.threshold_buy = this.settings.threshold_buy_bull;
			this.market = 'bull';
		}
		if(this.indicators.maFast.result < this.indicators.maSlow.result && this.market != 'bear'){
			this.threshold_sell = this.settings.threshold_sell_bear;
			this.threshold_buy = this.settings.threshold_buy_bear;
			this.market = 'bear';
		}
	}
},

  check : function(candle) {
    let currentPrice = candle.close;
    let prediction = this.indicators.NN.prediction;
	log.debug(prediction);
    let predictedPercentChange = (prediction - currentPrice) / currentPrice * 100;
	this.updateSlow(predictedPercentChange);
	this.updateFast(predictedPercentChange);
	let predictDiff = this.pFastResult - this.pSlowResult;
    
    if(this.waitTime > 0){
	  this.waitTime--;
      return;
    }
	log.debug(`
	  Current market: ${this.market}
	  Percent change predicted: ${predictedPercentChange}
	  Current price: ${currentPrice}
	  Last buy price: ${this.lastBuyPrice}
	  Current position: ${this.previousAdvice}
	  Prediction Fast: ${this.pFastResult}
	  Prediction Slow: ${this.pSlowResult}`);
	
	 
	//if predicted hasn't been positive yet when previousAdvice == none
	//return as i don't want to sell immediately
	if(this.previousAdvice == 'none' && predictedPercentChange < 0) {
		return;
	}

    if(this.indicators.zTrailingStop.shouldSell){
      this.indicators.zTrailingStop.short(currentPrice);
	  this.indicators.zTakeProfit.sell();
      this.waitTime = this.stoplossWait;
      
      if(this.lastBuyPrice < currentPrice)
        this.market == 'bear' ? this.bearProfits++ : this.bullProfits++;
      else
        this.market == 'bear' ? this.bearLosses++ : this.bullLosses++;

      this.previousAdvice = 'short';
      return this.advice('short');
    }
	
	if(this.indicators.zTakeProfit.shouldSell){
		this.indicators.zTrailingStop.short(currentPrice);
		this.indicators.zTakeProfit.sell();
      
		if(this.lastBuyPrice < currentPrice)
			this.market == 'bear' ? this.bearProfits++ : this.bullProfits++;
		else
			this.market == 'bear' ? this.bearLosses++ : this.bullLosses++;

		this.previousAdvice = 'short';
		return this.advice('short');
	}

    if(( predictedPercentChange < this.threshold_sell) && this.previousAdvice != 'short' && !this.indicators.zTakeProfit.isActivated)
    {
      this.indicators.zTrailingStop.short(currentPrice);
	  this.indicators.zTakeProfit.sell();
      if(this.lastBuyPrice < currentPrice)
        this.market == 'bear' ? this.bearProfits++ : this.bullProfits++;
      else
        this.market == 'bear' ? this.bearLosses++ : this.bullLosses++;

      this.previousAdvice = 'short';
	  log.debug(`Current Price: ${currentPrice}`);
      return this.advice('short');
    }
	//Buy Threshold Hit
    if(predictedPercentChange > this.threshold_buy && this.previousAdvice != 'long' && !this.isCheckingPredictions)
    {
		this.isCheckingPredictions = true;
	}
	//Check current prediction (if they are equal don't go in here)
	if(this.isCheckingPredictions)
	{
		if(predictDiff > 0)
		{
			//When predictDiff > 0, keep going as price should be falling
		}
		else
		{
			//When current < last, buy as the price should be rising
			this.isCheckingPredictions = false;
			this.indicators.zTrailingStop.long(currentPrice);
			this.indicators.zTakeProfit.bought(currentPrice);
			this.lastBuyPrice = currentPrice;
			this.previousAdvice = 'long';
			log.debug(`Current Price: ${currentPrice}`);
			return this.advice('long');
		}
	}
  },

  end : function() {
    log.info("Stoploss triggered: " + this.indicators.zTrailingStop.timesStopped + " times.")
	log.info("TakeProfit triggered: " + this.indicators.zTakeProfit.timesStopped + " times.")
    log.info(`Bear profits: ${this.bearProfits}, Bull profits: ${this.bullProfits}`);
    log.info(`Bear Losses: ${this.bearLosses}, Bull Losses: ${this.bullLosses}`);
	this.indicators.NN.saveTrainer();
  }
};

module.exports = strategy;
