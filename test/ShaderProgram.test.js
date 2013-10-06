/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */


function TriangleProgram(options) {
    TriangleProgram.super.constructor.call(this, _.defaults(options||{}, {
        copyOnSwap: true,
        vertexShader: [
            "attribute vec2 a_position;",
            "void main() {",
            "   setPosition(a_position);",
            "}"
        ],
        fragmentShader: [
            "uniform vec3 u_color;",
            "void main() {",
            "   setFragColor(vec4(u_color, 1.0));",
            "}"
        ]
    }));
}
TriangleProgram = Webvs.defineClass(TriangleProgram, Webvs.ShaderProgram, {
    draw: function(color, x, y) {
        this.setUniform.apply(this, ["u_color", "3f"].concat(Webvs.parseColorNorm(color)));
        this.setVertexAttribArray(
            "a_position", 
            new Float32Array([
                -0.8+x, -0.6+y,
                0.46+x, -0.5+y,
                -0.7+x, 0.7+y
            ])
        );
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
    }
});

CanvasTest("ShaderProgram BasicTest", 1, function(canvas, gl) {
    var program = new TriangleProgram();
    program.init(gl);
    program.run(null, null, "#0000FF", 0, 0);
    equal(
        canvas.toDataURL(),
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAACuUlEQVR4Xu3aYXKCMBCGYbyZPVntyWpP1iYdmaEWlWxC+LL7MsOfqnTdhy/g6mmapu+0s4l04ASIiMStDEC0PCZAABHrgFg5JAQQsQ6IlUNCABHrgFg5JAQQsQ6IlUNCABHrgFg5JAQQsQ6IlVOZkEt6O3lna9WBCpBzquEz7R+gtNJIx2kAkqsBpZVJIxBQBEFAaYFSkZB8MX9fqYHlqwZmBxCSIggCihWlIiH5ljff+j7b3tKDV2ttIV+3M0juKSglZ1YHEFA6gZT+4JGkbIGpSEgpCEkRBAHlFYoxIfnuKt9lWTeWr0edOwgk3wpnFLb7DhwEkssAZe10PBAElIYgl3SstcGiZQkiKcuuGRPSEoSkCIKAMqMYE7JlsMjyZemAGEh+C7G/4BIEiY1iBLHMsUoDHDMpwiAxkyIOEg/FAHJOXaoZLJYuXbFQBgGJgzIQSAyUwUD8oxhAWs+xuKZUzrIUQPwmZdCEzOeUvw+PBpC9BouWpctfUhyA+EJxAuIHxQDSY7AYd/lyBpIhx/7Nl0OQsVEKQY4YLFqXrzGT4hhkzKQ4BxkPJQDIWCiFICpzLMt1ZYxrSiCQ6+2W2ILZ7zWBQHJT9VEKQdQGi5YzVxslIIh2UoKC6KIUgigPFn0sX8FB9JICyG+wdL4KLgAZabBoWb40UAD5Y3c8CiD/wnQsCiCrq9txKAUgIw8Wx7mmAPLUqn9SAHkZnr4oBSAeBovL7uch47x93bHMjy2f81KuyROcgGxp7vypvEnfdjuIKMijBi//3v/s3U1hceACEOtgccvZ67O5FkADyNy8R+vuGEuDpVk9XlMA0qMc/gcgYucAIICIdUCsHBICiFgHxMohIYCIdUCsHBICiFgHxMohIYCIdUCsHBICiFgHxMohIYCIdUCsHBICiFgHxMohIYCIdUCsnB88eO8BxQEqiwAAAABJRU5ErkJggg==",
        "canvas should display a blue triangle"
    );
    program.cleanup();
});


CanvasTest("ShaderProgram BasicBlendTest", _.keys(Webvs.blendModes).length, function(canvas, gl) {
    var imageData = _.object([
        [Webvs.REPLACE, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAACyUlEQVR4Xu3cXW6DMBAEYOdmPRpHy83aUDUVScAsa3u8P4OUp5oYzceuaz/kVkr5fnx4GUngRhAjEn+PQRBbHoUgBDGWgLHHYYWkBPlaSrk/PrxOE8BUyAqyXkQxBkIUgyBEqaJgW9b2Udi+dmHGgzzXj73pifKRylwQti+DIER5QZlfIc/HYfv6TcIOCCulHWT5KmW5n/xrXVvUudD3XUNWkPWqolwFSV4pTS3rCVJF0YAkRukGcoiiBUmK0hVkF6UFJCGKGmTbrt5Xppc1pRUkGcoQkJdK6QGSCGUYyD9KL5AkKGNBynKySVH8OfiO3h9I8ErxCRIYxS9IUBTfIAFR/IMEQ4kBEgglDkgQlFggAVDigThHUYHUDha3e+9lxE5durl3uqMniBQYNC4uiNPWNQxkarvavs3OWld8EGeVkgPEEUoeECcouUAcoOQDMY6SE8QwSl4Qoyi5QQyiEMQYymUQFweLmnMnIzt6ghg7ZiHIezVNrpQhIGYOFjWta/KaQpAjtEmVQpBaFU1AIchZWwOjEOQMBLymEEQCAkQhiBQEhEKQKyAAFIJcBRmMQhANyECUSyBhDxYNoRBEi/G8r/M+hSCtIJ3bV3cQ9weLWqBOlUIQLcDefR1QCKIB6RD80bTpQdYWe/qreBo05T2hQFrWLysopkFaAta8oBZQYCDocDUg6z2zUbqDaIOwdN9MFIIcvAmzUAhSKc0ZKGIQ6cGipdbT41nQKAQRqCFRCLIBQQbfvFP31rIshCsovo8hLirEa7huQDIFfBWluUIY7tXI6+PFIH2n5bc1L+qMEJMAKwSTs3gWgoijwgwkCCZn8SwEEUeFGUgQTM7iWQgijgozkCCYnMWzEEQcFWYgQTA5i2chiDgqzECCYHIWz0IQcVSYgQTB5CyehSDiqDADCYLJWTwLQcRRYQYSBJOzeBaCiKPCDPwB0yE6EEyIqTkAAAAASUVORK5CYII="],
        [Webvs.MAXIMUM, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAC2klEQVR4Xu3ca26DMBAEYOdmOVqOlpu1gJoqJGAWsx7vY6jyb8FoPtYOjtRbKeVn+vAwksCNIEYk/m6DILY8CkEIYiwBY7fDDkkJcn+U8pw+PA4TwHTIDDIfRDEGQhSDIESpomCnrPdb4fS1CdMf5LV+bA1PlK9UxoJw+jIIQpQVyvgOed0Op68lCTsg7JTrII97KY/nwVfr2qLOhV53DZlB5qOKchYkeadcmrJeIFWUFpDEKGoguyitIElRVEE2Ua6AJERpBnmfrj5XptWachUkGUoXkFWnaIAkQukG8o+iBZIEpSvI9IV4+lM+gr/RdwdZOkXZJPIvjxAQosifSBgIUWQoUBCiHKPAQYhSRxkCQpR9lGEgRNlGGQpClG+U4SBEWaM0gdQ2FteXl78SyiuPv6ksFU7f6M2AqHcKQbae3PPP/fkzKh3jEKVjh7RH237mBo4zFJMgmacvsyBZUUyDZEQxD5INxQVIJhQ3IFlQXIFkQMkNYnCLxR2IepcYQzkN0mNjUbhduCpTfZs3hOIWJGqnuAaJiNIJRH1Cqc5q6qMN3JAMARKpU8KAREEJBRIBJRyId5SQIJ5RwoJ4RQkN4hElPIg3lBQgnlBOgVjZWGzZjPSCkgrEA0o6EOsoHUDUt/paZyiXG5JpQax2SmqQZpSO2/PpQZb/NvHsMis2XTQYSPv6ZQXFOEh7wC2PpwUUIAg23BaQZU0ZPH11AGmNws55I1EIsvMcjEIhSKUxR6CIQeQbi3amHo07QaMQRKCGRCHIGwgy+L3nICyIhXAFzfdV4gLEa7huQDIFfBblcocw3LOR1+vFILrD8mqXF3VGiEmAHYLJWTwKQcRRYQoJgslZPApBxFFhCgmCyVk8CkHEUWEKCYLJWTwKQcRRYQoJgslZPApBxFFhCgmCyVk8CkHEUWEKCYLJWTwKQcRRYQoJgslZPApBxFFhCgmCyVk8CkHEUWEKfwHs4jYQ/FLTjwAAAABJRU5ErkJggg=="],
        [Webvs.AVERAGE, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAC2klEQVR4Xu3c6W0CMRQEYNNJSqE0SqMUOkkwySIIezxf43fMSvkTmXgzH2NnHYlTSun7/sVLSQIngiiR+LsNgujySAQhiLIElN0OGxIS5Ouc0u2q7FfXeTuYhmSQfBHl8F2ABSGKQhCi7KLgG7LcDpevVZjxIMv+sTY9UT5SmQvC5UshCFHeUOY3hHuKUhA25QHT1JDL/XnvcvQAvrepc6Pvu4dkkHztopSCBG9Kc0MW4k2UGpDAKN1ANptSCxIUpSvIKkoLSECUapBl/1jbl9+Wr1aQYChDQN6a0gMkEMowkCdKL5AgKENBrumcrre1Ra3he84PJIeD5OiJIn8DQkCIohCEKDIUWEOW2+HytQ8DB2FTFIIQZRtlSkO4fCkFYVM+YaY2hE3pBLJ3sPg6RX5Sl1786+s3qaqGjADpvnwZPWJRBUKUgQ0pWa7+L2tdly9jTRnWkBaQyE1RCxIVRTVIRBT1INFQTIBEQjEDEgXFFEgElNggWVjZc4o5kO4tUYZSDDLqHEt6COn9hNgsiNemmAbxiDIEpPUcK/Ly5QLEU1PcgHhBcQXiAcUdiHUUlyCWUdyCWEVxDWIRxT2INZQQIJZQikC0HCyWPslbOpAMBWKhKeFAtKN0B0EfLHpbvsKCaG1KaJBqlIH/hw8Pcv+sieNPxatdFyte5wokh1t7HX5UYe0PLnydapCWgAtzeAzXgAIDQYdbA6IBpTtIbRCaXjezKQTZeCfMQiHITjVnoIhBpAeLmpaeHveCRiGIQA2JQpAXEGTwW+8DtyAawhWU72OICRCr4ZoBiRRwKUpzQxhuaeT748UgfaflT2ve1BkhJgE2BJOzeBaCiKPCDCQIJmfxLAQRR4UZSBBMzuJZCCKOCjOQIJicxbMQRBwVZiBBMDmLZyGIOCrMQIJgchbPQhBxVJiBBMHkLJ6FIOKoMAMJgslZPAtBxFFhBhIEk7N4FoKIo8IM/AHs2Y4QyGiyAQAAAABJRU5ErkJggg=="],
        [Webvs.ADDITIVE, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAC2UlEQVR4Xu3ca27CMBAEYHMzjsbRuFmbtKUiJHHWr/E+JhK/uuBovqxdm6q3lNLX8uKlJIEbQZRI/N0GQXR5JIIQRFkCym6HHRIS5P5I6bm8eF0mgOmQFWS9iKIMhCgKQYiSRcFOWe+3wunrEGY8yGv9OBqeKLtU5oJw+lIIQpQNyvwOed0Op6+fJPSAsFPaQR73lB7Pi1+tc4s6F/q+a8gKsl5ZlFKQ4J3SNGW9QLIoNSCBUbqBnKLUggRF6QpyiNICEhClGuR9uvpcmTZrSitIMJQhIJtO6QESCGUYyD9KL5AgKENB0oJxuU+52Mbsfux8Rz8c5HKfUgrivFMgIESRP3UwEKLIUKAgRLlGgYMQJY8yBYQo5yjTQIhyjDIVhCh7lOkgRNmiVIHkDhY3H19wbMId/W9yakC6d4rRIxZVIEQZ2SEF09Xn0tZ1+jLWKeM6pAEkcqeoBYmKohokIop6kGgoJkAioZgBiYJiCiQCSmwQhd/PmwPp3iXKUIpBRhwsXn+xua/ouptXhGIWxGunmAbxiDIGpPEcq3QK8zR9uQDx1CluQLyguALxgOIOxDqKSxDLKG5BrKK4BrGI4h7EGkoIEEsoRSBaDhZLd/Kvegs7+lAgFjolHIh2lP4g4INFb9NXWBCtnRIapBpl4N8LhwdZ//1599++aufR5X2+QBqeXC0oukEaAq55SDWg4EDA4daAVK8ptYMdvK8/SMebm/VRMzuFICfqs1AIkmnDGShiEPHB4qx5ZtC4aBSCCCCRKAR5A0EGf/YcuAXREK6g+XYlJkCshmsGJFLApSjNHcJwSyPP14tB+g7LT2te1BkhJgF2CCZn8SgEEUeFKSQIJmfxKAQRR4UpJAgmZ/EoBBFHhSkkCCZn8SgEEUeFKSQIJmfxKAQRR4UpJAgmZ/EoBBFHhSkkCCZn8SgEEUeFKSQIJmfxKAQRR4UpJAgmZ/EoBBFHhSn8BrQuZBC8Ok/zAAAAAElFTkSuQmCC"],
        [Webvs.SUBTRACTIVE1, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAACh0lEQVR4Xu3cUXLCMAxF0bAzlsbSurM20DJTCqSy48hP0s1M/wQW70Sm8QenZVk+1z8ukQROgIhI/LQBiJbHAgggYgmItcOEACKWgFg7TAggYgmItcOEACKWgFg7TAggYgmItcOEACKWgFg7TEgmkMt5WS4fYp8oeDu7JuQKcr1AGXcXDAEBRRAElDEowybk3g7b1z6YbpD798er5UHpRzkEhO1LEASUPpTDJuTWzvqMcunrq+yrDge5TUrZeNs/uAsIKHYYNxBQbCiuIKD8j+IOAso2yhQQUN6jTAMB5TXKVBBQnlGmg4DyiNIFsnWw+PD265O69eLh8TspGRAmRRAElCMnpGG7+rutVd6+jtuydoBUnhRZkKoo0iAVUeRBqqGEAKmEEgakCkookAoogFjPdpzqwoFkn5JmkCMOFntuvqxP82FBsk5KaJCMKMeA7DzHat3CMm1fKUAyTUoakCwoqUAyoKQDiY6SEiQySlqQqCipQSKipAeJhlICJBJKE4jKwWLrk/y9PsITfSmQCJNSDkQdZTyI88Fitu2rLIjqpJQGUUQpD7KctX6ALRfIGm7vpfILRtogOwLugVFA8QNxDrcH5PadMvm/xPEgvUkIvW4mCiBvboRZKIBsTOYMFDOI+WBRaOsZ0Yo3CiAGNU8UQH6BeAb/7j5IC6IQrmH4nkpCgEQNNwxIpYBbUXZPCOG2Rr5dbwYZuyzvtvtLnQh9EmBCfHI2rwKIOSqfQkB8cjavAog5Kp9CQHxyNq8CiDkqn0JAfHI2rwKIOSqfQkB8cjavAog5Kp9CQHxyNq8CiDkqn0JAfHI2rwKIOSqfQkB8cjavAog5Kp9CQHxyNq8CiDkqn8IvZEnoAb/Z7KwAAAAASUVORK5CYII="],
        [Webvs.SUBTRACTIVE2, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAC10lEQVR4Xu3caW7CMBAFYHOzHi1H42YtRqRiizPenmd5kfhVU0fvy4yxkbiklH5vL15KErgQRInE4zYIossjEYQgyhJQdjuskJAgP1tK19uL12kCmArJIPkiijIQoigEIUoRBduynm+F7esrzHyQff34Nj1RPlJZC8L2pRCEKC8o6ytkvx22r3sSekBYKf0g209K2/Xko3VpUedCP3YNySD5KqLUggSvlK6WtYMUUVpAAqMMAzlEaQUJijIU5CtKD0hAlGaQ53b1vjK9rCm9IMFQpoC8VMoIkEAo00D+UUaBBEGZDLKl9PhofLJbkf/Z+Y5+PkiOmijiBw4DQhSFIEQRoeAqZL8dtq8iDB6ElaIQhCiHKGsqhO1LKQgr5QNmbYWwUsaAlA4Wn2fYanbV/PR1j66pQqaAjG5fNQ+DaIeAGaQLhCjzKqSqXb0/fCPbl7FKmVYhXSCBK0UvSFAU3SABUfSDBEOxARIIxQ5IEBRbIAFQYoNkYGX7FHsgo6tEGUo1yLRzrNqjopG7eUUodkGcVoptEIcoU0C6z7ECty8fII4qxQ+IExRfIA5Q/IEYR/EJYhjFL4hRFN8gBlH8gxhDiQFiCKUKRM3BYu1Ofh9v4EAyFoiBSokHohxlOAj8YNFZ+4oLorRSYoO0okz8Hj48yHb76Y/TX8VrbYsN73MFksNtvbSgqAbpCbgFRgMKDAQdbgtIfs9qlOEgrUFoet9KFIIcPAmrUAhSKM0VKGIQ6cGiptYz4l7QKAQRqCFRCPIEggz+6DlwC6IhXEHxfQwxAWI1XDMgkQKuRemuEIZbG3l5vBhk7LT8b92LOiPEJMAKweQsnoUg4qgwAwmCyVk8C0HEUWEGEgSTs3gWgoijwgwkCCZn8SwEEUeFGUgQTM7iWQgijgozkCCYnMWzEEQcFWYgQTA5i2chiDgqzECCYHIWz0IQcVSYgQTB5CyehSDiqDAD/wCm5WgQDp1/jgAAAABJRU5ErkJggg=="]
    ]);

    var copier = new Webvs.CopyProgram();
    copier.init(gl);

    var fm = new Webvs.FrameBufferManager(canvas.width, canvas.height, gl, copier);

    _.each(Webvs.blendModes, function(blendMode) {
        fm.setRenderTarget();

        // clear
        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // draw a red triangle
        var program = new TriangleProgram();
        program.init(gl);
        program.run(fm, null, "#804000", 0, 0);

        // draw a blue triangle
        var program2 = new TriangleProgram({outputBlendMode: blendMode});
        program2.init(gl);
        program2.run(fm, null, "#004080", 0.2, 0.2);

        fm.restoreRenderTarget();
        copier.run(null, null, fm.getCurrentTexture());

        equal(
            canvas.toDataURL(),
            imageData[blendMode],
            "Blended triangles for mode " + blendMode + " should be correct"
        );

        program.cleanup();
        program2.cleanup();
    });

});
