declare var require: any;
const testsContext= require.context(".", true, /\.test$/);
testsContext.keys().forEach(testsContext);