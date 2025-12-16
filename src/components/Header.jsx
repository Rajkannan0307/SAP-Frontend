const SectionHeading = ({ children }) => {
    return (
        <h2 className="relative m-0 text-[#2e59d9] inline-block text-xl font-bold">
            <span className="relative z-10">{children}</span>

            {/* Underline */}
            <span
                className="
          absolute left-0 -bottom-1.5
          w-full h-0.75
          bg-[#88c57a]
          rounded
        "
            />
        </h2>
    );
};

export default SectionHeading;
