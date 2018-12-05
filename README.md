# gekko-neural-network-strategy

Install the modules in your gekko folder: `npm install convnetjs mathjs`

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
