namespace Api.Models
{
    public class BaseResponse<T>
    {
        public T Data { get; set; }
        public bool Success { get; set; } = false;
    }
}
