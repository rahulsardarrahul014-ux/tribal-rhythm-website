function tribalAlert(icon, message) {

    Swal.fire({

        icon: icon,

        title: "Tribal Rhythm Says",

        text: message,

        confirmButtonText: "OK",

        confirmButtonColor: "#FFD700",

        background: "#111",

        color: "#fff"

    });

}


function tribalRedirect(icon, message, url) {

    Swal.fire({

        icon: icon,

        title: "Tribal Rhythm Says",

        text: message,

        confirmButtonText: "Continue",

        confirmButtonColor: "#FFD700",

        background: "#111",

        color: "#fff"

    }).then(() => {

        window.location.href = url;

    });

}