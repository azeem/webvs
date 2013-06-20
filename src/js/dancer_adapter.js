/**
 * Created with JetBrains WebStorm.
 * User: z33m
 * Date: 6/11/13
 * Time: 12:56 PM
 * To change this template use File | Settings | File Templates.
 */

function DancerAdapter(dancer) {
    this.dancer = dancer;
    this.beat = false;

    var _this = this;
    this.kick = dancer.createKick({
        onKick: function(mag) {
            _this.beat = true;
        },

        offKick: function() {
            _this.beat = false;
        }
    });
    this.kick.on();
}
extend(DancerAdapter, Object, {
    isPlaying: function() {
        return this.dancer.isPlaying();
    },

    getWaveform: function() {
        return this.dancer.getWaveform();
    },

    getSpectrum: function() {
        return this.dancer.getSpectrum();
    }
});

window.Webvs.DancerAdapter = DancerAdapter;