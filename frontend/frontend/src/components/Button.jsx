import "../styles/button.css";

function Button({ text, color = "#2563eb", onClick }) {

    return (

        <button
            className="primary-button"
            style={{ backgroundColor: color }}
            onClick={onClick}
        >

            {text}

        </button>

    );

}

export default Button;