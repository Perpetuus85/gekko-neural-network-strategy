# gekko-neural-network-strategy

Install the modules in your gekko folder: `npm install convnetjs mathjs`

I find it best to run this strategy via CLI.

Below configuration is tailored towards USD/BTC 10m candles on GDAX (no fees since GDAX charges 0 for maker which gekko does).

pFast/pSlow is the average of the previous # of predictions. This was just a trial to see if the average would make a difference in following the prediction movement.  They can be kept at 1 as I could not find a better result.

NN information can be found here: `https://cs.stanford.edu/people/karpathy/convnetjs/docs.html`

You can change the number of activation layers, the type of activation layer, batch size, neurons, etc., for the NN parameters.

I run gekko on an AWS EC2 instance, hence the file_name parameter.

If shouldLoad is true, it will try to load the saved trainer from the file_name.  The trainer is saved at the file_name parameter after every run.

If you want to use MACD or RSI to figure out BULL/BEAR, just change enabled to true on one of them and it will use that to figure out the market instead of SMA.  It turned out that bull/bear didn't matter too much with this so I kept the buy/sell thresholds the same.

I added a take profit indicator, meaning that if you are long and you hit the percent, it will keep it open until it loses the loss_percent parameter from the max price during the buy after it hits.

The profit will change for every run, as there are neurons and layers in the neural network and predictions will change.

I have been backtesting this from 2018-01-01 to current date (as of today 2018-12-05) over the course of development.  It seems to get a profit between 40-80% with a market change of -71%. (NOV/DEC have not been kind).

I have not tried this live yet.  Once I get more comfortable with the strategy and backtesting, I will try out live soon.

# Configuration

```javascript
config.nnlayers = {
  threshold_buy_bear: 0.38,
  threshold_buy_bull: 0.38,
  threshold_sell_bear: -1.11,
  threshold_sell_bull: -1.11,
  NN_SMMA_Length: 4,
  maFast: 50,
  maSlow: 250,
  pFast: 1,
  pSlow: 1,
  diffThreshold: 1,
  shouldLoad: 'false',
  activation: 'relu',
  numOfLayers: 2,
  decay: 0.001,
  momentum: 0.7,
  price_buffer_len: 80,
  method: 'sgd',
  learningrate: 0.01,
  batchsize: 10,
  neurons: 30,
  file_name: '/home/ubuntu/gekko/testjsonfile.txt',
  stoploss_threshold: 1.5,
  stoplossWait: 120,
  waitTime: 1800,
  takeProfit: {
    profit_percent: 2,
    profit_loss_percent: 0.25
  },
  macd: {
    enabled: false,
    short: 12,
    long: 25,
    signal: 9,
    thresholds: {
      down: -0.00025,
      up: 0.00025,
      persistence: 1
    }
  },
  rsi: {
    enabled: false,
    interval: 14,
    thresholds: {
      low: 30,
      high: 70,
      persistence: 1
    }
  }
}
```

# Credits

Based on NNv2 strategy located at `https://github.com/zschro/gekko-neuralnet`
