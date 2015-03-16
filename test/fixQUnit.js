// remove all the Qunit globals so that it doesnt interfere
// TODO: remove after QUnit2.0 release
for(var key in QUnit) {
    if(QUnit.hasOwnProperty(key) && window[key] === QUnit[key]) {
        delete window[key];
    }
}
