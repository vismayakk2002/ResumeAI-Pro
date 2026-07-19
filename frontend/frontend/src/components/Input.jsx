import "../styles/input.css";

function Input({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  name,
}) {
  return (
    <div className="input-group">

      <label>{label}</label>

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        name={name}
      />

    </div>
  );
}

export default Input;