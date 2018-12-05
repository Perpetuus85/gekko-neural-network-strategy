const log = require('../../core/log');

var Indicator = function(takeProfit) {
  this.input = 'candle';
  this.highestClosePrice = 0;
  this.shouldSell = false;
  this.lossPercent = takeProfit.profit_loss_percent;
  this.profitPercent = takeProfit.profit_percent;
  this.timesStopped = 0;
  this.isActivated = false;
  this.lastBuyPrice = 0;
  this.timesActivated = 0;
}

Indicator.prototype.update = function(candle) {	
	
	if(this.isActivated && candle.close > this.highestClosePrice) {
		this.highestClosePrice = candle.close;
	}
	
	if(!this.isActivated && this.lastBuyPrice != 0){
		const checkTarget = (candle.close - this.lastBuyPrice) / this.lastBuyPrice * 100;
		if(checkTarget > this.profitPercent) {
			this.isActivated = true;
			this.timesActivated++;
			//log.debug("TakeProfit activated: " + this.timesActivated);
			this.highestClosePrice = candle.close;
		}
	}
	
	if(this.isActivated) {
		//log.debug("Last Close Price: " + this.highestClosePrice);
		const stopPrice = this.highestClosePrice * ((100 - this.lossPercent) / 100);
		//log.debug("Stop Price: " + stopPrice);
		if(candle.close < stopPrice) {
			this.timesStopped++;
			this.shouldSell = true;
			log.debug("TakeProfit Stop Triggered: " + this.timesStopped);
			this.highestClosePrice = 0;
			this.lastBuyPrice = 0;
			this.isActivated = false;
		}
	}
  
}

Indicator.prototype.bought = function(price) {
	this.lastBuyPrice = price;
	//log.debug("Take Profit Bought");
}

Indicator.prototype.sell = function() {
	this.lastBuyPrice = 0;
	this.isActivated = false;
	this.highestClosePrice = 0;
	this.shouldSell = false;
	//log.debug("Take Profit Sold");
}

module.exports = Indicator;
