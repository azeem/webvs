/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

CanvasTest("SuperScopeShaderTest", 4, function(canvas, gl) {
    var copier = new Webvs.CopyProgram({dynamicBlend: true});
    copier.init(gl);
    var fm = new Webvs.FrameBufferManager(canvas.width, canvas.height, gl, copier);
    var program = new Webvs.SuperScopeShader();
    program.init(gl);

    var data = [
        {
            points: [-0.8,-0.6, 0.46,-0.5, -0.7,0.7],
            colors: [1,0,0, 0,1,0, 0,0,1],
            dots: true,
            thickness: 1
        },
        {
            points: [-0.8,-0.6, 0.46,-0.5, -0.7,0.7],
            colors: [1,0,0, 0,1,0, 0,0,1],
            dots: true,
            thickness: 2
        },
        {
            points: [-0.8,-0.6, 0.46,-0.5, 0.46,-0.5, -0.7,0.7],
            colors: [1,0,0, 0,1,0, 0,1,0, 0,0,1],
            dots: false,
            thickness: 1
        },
        {
            points: [-0.8,-0.6, 0.46,-0.5, 0.46,-0.5, -0.7,0.7],
            colors: [1,0,0, 0,1,0, 0,1,0, 0,0,1],
            dots: false,
            thickness: 2
        }
    ];

    var assert = [
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAABmklEQVR4Xu3cwQrCQBTF0On/f7Ra0PUrtAxBTsHVoI2JF8GFx1rr9Xm4IgYOQSIlvhiCtHosQQSJGYjhWIggMQMxHAsRJGYghmMhgsQMxHAsRJCYgRiOhQgSMxDDubGQ81f78+muJw3cCPIkhtf6GRAk9lkQRJCYgRiOhQgSMxDDsRBBYgZiOBYiSMxADMdCBIkZiOFYiCAxAzEcCxEkZiCGYyGCxAzEcCxEkJiBGI6FCBIzEMOxEEFiBmI4FiJIzEAMx0IEiRmI4ViIIDEDMRwLESRmIIZjIYLEDMRwLESQmIEYjoUIEjMQw7EQQWIGYjgWIkjMQAzHQgSJGYjhWIggMQMxHAsRJGYghmMhgsQMxHAsRJCYgRiOhQgSMxDDsRBBYgZiOBYiSMxADMdCBIkZmHA2/8W9hUxBNp8Lsln4dDtBJkObzwXZLHy63aUgm7/XJua/Pr8U5K8NxN6cIILEDMRwLESQmIEYjoUIEjMQw7EQQWIGYjgWIkjMQAzHQgSJGYjhWIggMQMxHAsRJGYghmMhgsQMxHDeY4dnAf+WRkwAAAAASUVORK5CYII=",
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAABlElEQVR4Xu3cwQqCUAAF0ef/f3QZJLRT0B5jHcGVYMOMl8CFyxjjsZ6OiIFFkEiJN4YgrR5DEEFiBmI4FiJIzEAMx0IEiRmI4ViIIDEDMRwLESRmIIZjIb8TZHtJ/GrquMrAiYUIclWEz/ucCPINHPcUJPYMCCJIzEAMx0IEiRmI4ViIIDEDMRwLESRmIIZjIYLEDMRwLESQmIEYjoUIEjMQw7EQQWIGYjgWIkjMQAzHQgSJGYjhWIggMQMxHAsRJGYghmMhgsQMxHAsRJCYgRiOhQgSMxDDsRBBYgZiOBYiSMxADMdCBIkZiOFYiCAxAzEcCxEkZiCGYyGCxAzEcCxEkJiBGI6FCBIzEMOxEEFiBmI4FiJIzEAMx0IEiRmI4ViIIDEDMRwLESRmIIZjIXtBJn9RXRBB9gz893ULifUX5I5BJv+vxRTNxTm0EEHmRTkUZB6OXxIk9gwIIkjMQAzHQgSJGYjhWIggMQMxHAsRJGYghmMhgsQMxHAsRJCYgRiOhQgSMxDDsRBBYgZiOBYSC/IEQoRqAbSqvDgAAAAASUVORK5CYII=",
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAEdklEQVR4Xu2cP0hVYRjGn7RsUCjIISFBh4SCHAwqdCgDhRwMEmwwKFCooKCGgoQaFAx0UEjQoCBBBwWDGhQMsgYlgxwUFGxIMKihoKCG/lm+UBRheY/n+/N857wX7uQ57/s8v9/5cPB6NwD4vvLWFwmBDSqExMTPGCqEywdUiAohI0AWR0+ICiEjQBZHT4gKISNAFkdPiAohI0AWR0+ICiEjQBZHT4gKISNAFifeCcn6Bixnk1UKO048IdI95xPweXPYFIjSxxciZXI/AB/ziGqFG8WMEOm/5R3wfmu4JEiSmxMihba9Ad7mk1QLM4ZZIcJg+yvgdUGYNAhSmxcipXYsAS8LCeqFF8GOEOFQ9AJYLA6PiOfE9oRIsZ0LwPMSzxXDWm9XiLDYNQfM7w6Lise09oVIuT0zwGypx5rhrHYjRHiUPQOm94ZDxlNSd0Kk4L4p4Ol+T1XDWOtWiDApnwAmK8Kg4yGleyFS8uAj4PEhD3X5V/oRUvkQGD/MT8dDQj9CpGjVGPCg2kNl7pX+hAiXIyPAaA03Icfp/AqRsrX3gPtHHdfmXedfiLA5NgzcreOl5DAZhxApXD8IDB13WJ1zFY8Q4dPQDwyc4CTlKBWXECl98g7Qd8pRfb41fEKEUeMt4HYTHy0HiTiFSPEzPUDvWQcIuFbwChFO524A3ee5iFlOwy1Eyl/oBLouWsbAM55fiLC61A50XOahZjFJGEIEwJU24HqzRRQco8MRIryutgCt1zjIWUoRlhCB0HIVuNZqCYf/seEJEWZtV4Dm6/7pWUgQphAB0X4JuNxhAYnfkeEKEW6dF4CLXX4JGt4ethCBceMccL7bMBZ/48IXIux6zgBne/1RNLg5GUIEyK1GoOm2QTR+RiVHiPC7cxI41eeHpKGtyRIiUPobgBMDhvC4H5M8IcJwsB44PuSepoGNyRQiYIaPAXV3DSByOyK5QoTjvVrg6H23RGNuS7YQgTNyBKgZjYnJ3e3JFyIsx6qA6gfuqMbYlA4hAuhhJXB4PAYqN7emR8ijg8Chx26oxtiSHiECaaIcqJiMgcv+rekSIjyn9gH7n9onu84N6RMioJ6VAXun14nM7m3pFCJMZ/YApbN26a5jenqFCKy5XcDu+XVgs3dLuoUI14WdQMlze4QjTlYhAuxFEVC8GBGdnctVyC+uSzuAwpd2KEeYqkL+hPVqO1DwOgI+85eqkL+ZvtkG5L81TzrDiSpkNVDvtgBb32eI0OxlKuRfPD/kAnkfzdLOYJoK+R+kTznA5s8ZYDR3iQpZi+W3LCB7ea2rjP08dULke9S+boz2dvn19sELkX/YjQJ46oCxh9nKICohvadXh/tl07+h31z5FGmSXlaFPFn5Nr8oT28CPgka+9nIWIj8bosCV64l/ZNDbGg2B2QsxGYInf2bgAohexpUiAohI0AWR0+ICiEjQBZHT4gKISNAFkdPiAohI0AWR0+ICiEjQBZHT4gKISNAFkdPiAohI0AWR0+ICiEjQBZHT4gKISNAFucHNEwgEFlIC2MAAAAASUVORK5CYII=",
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAE10lEQVR4Xu2cd4wVVRTGB1ggINI0IKCUUFQEQi8S6SAdpYZeJHRBQpHOgnQl0osREGmh7yq9lwDSidKF2OgBBQUNnXdyIIGV8t7M3Hu/O++8ZP/YZOae7/v93pkt2Wwix3Huhz7kBUIgkQgBMfEwhgjB8uGIEBECRgAsjmyICAEjABZHNkSEgBEAiyMbIkLACIDFkQ0RIWAEwOLIhogQMAJgcTxsSOi39onvOc69JGCV7I7jQUioeMxtlnIrud0UgNJ7E0JFUvzLUm6kAqplbxTvQqj7y3+zlGtp7SUBktwfIVQm3Z8s5cqrINXsjOGfEOqf4SJLuZDJThoAqf0VQoUyn2UpZ94AqGdfBP+FEIOsv7GUX3PYR8RwYjVCqFTOUyzl5zyGK9o1Xp0Q4vDmcZZyLK9dVAymVSuEir1zmKX8VMBgTXtGqxdCLAoeZCkHithDxlBSPUKoXNG9LGVPCUNV7RirTwjxKLmLpewsbQcdAyn1CqGC721jKVvLGaiLP1K/EGJSfhNL2VgJn5DmhGaEUMnK61jK2qqaK2OPMyeEuFRb5ThJ7jrOilrYlDSmMyuEitaO502J+1BjbdxR5oUQm7pLWcqSBrikNCXDEEJlGy7kx9eCJpqqY47BEUJ8ms7lTZnTApOWhlRYQqhwy29Yyqw2GurjjcATQow++pofX1+1xyOmOBGmECrdYSpvypTOihFgHY8rhDh1mchSJnTDoqYwDbYQKv7Jl/z4GttTIQaco/GFEKteY3hTRvfBIacoiR1CqHzfESxl+ABFKDCOtUcI8Ro4lKUMicWgpyCFXUJiB7OQQZ8pQIFxpF1CiNmw/iyl30gMgj6nsE8IARj1KUvp/bnPOMwfZ6cQ4vZFD/52uPs48xR9TGCvEIIwvitvyseTfERi9ii7hRC7yZ1YSsdpZkn6NN1+IQRiejt+fLWd4RMWc8cEQwjxm9maN6XVbHM0fZgcHCEE49vmLKXZPB/QmDkiWEKI4fzG/PhqtMgMUY9TgyeEgCyuz5tSb5lHPPpvD6YQ4rj8A5ZS5zv9VD1MDK4QgvJ9TX58VV/tAZHeW4MthFiueZ83pcp6vWRdTgu+EAKzoSJLqbDZJSZ9t0WHEOK5pSxLKbNdH10Xk6JHCMHZ8S5LKfWDC1R6bokuIcR0d3GWUmyfHsIRTok+IQRof2GWUuhQhLjUXx6dQojrj/lZSr4j6ilHMCF6hRCko2+zlLdORIBM7aXRLYTYnszNUnKdVks6zNNFCIH6JTtLyfZ7mNjUXSZCHrH943WWkuWcOtphnCxCHod0/jWWkvFSGOjUXCJCEnK9/ApLSf+XGuIvOFWEPA3Q1TQsJfU/2qWIkGchv/4SS0n5n1YpIuR5uG8mYylJ72iTIkIeQ03/VPVOzJMft2ISsxQipeEVWCE1VjwJ9nbS/8NOCP9Zn+v89/ZWCBkc6x5muNDpurOhH0VMv4wIiasTGWA37+740N842PjyLORMlsjgRvKOfXTtgOE2onWXOWwhd0Nf29zApHsSvsNrrnQXNhru8izE4G8ZAuknbCGBbA9YSoSASREhIgSMAFgc2RARAkYALI5siAgBIwAWRzZEhIARAIsjGyJCwAiAxZENESFgBMDiyIaIEDACYHFkQ0QIGAGwOLIhYEIeAESGmhB8y7B9AAAAAElFTkSuQmCC"
    ];

    _.each(data, function(data, index) {
        fm.setRenderTarget();
        // clear
        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        program.run(fm, null, 
                    new Float32Array(data.points),
                    new Float32Array(data.colors),
                    data.dots, data.thickness);

        fm.restoreRenderTarget();
        copier.run(null, null, fm.getCurrentTexture());

        equal(canvas.toDataURL(),
              assert[index], 
              "superscope shader rendering for setting " + index + " should be correct");
    });

    program.cleanup();
});
