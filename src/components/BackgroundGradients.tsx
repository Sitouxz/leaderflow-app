export default function BackgroundGradients() {
    return (
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
            <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[30%] bg-primary/5 rounded-full blur-[100px]" />
            <div className="absolute top-[40%] -left-[10%] w-[40%] h-[30%] bg-blue-900/10 rounded-full blur-[80px]" />
        </div>
    );
}
