export default function SiteSearch({className = ''}) {
  function handleSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const site = window.location.host;
    const search = form.elements.q.value;
    const query = `site:${site} ${search}`;

    const searchParams = new URLSearchParams();
    searchParams.append("q", query);

    const searchUrl = `${form.action}?${searchParams}`;
    window.open(searchUrl, "_blank");
  }

  return (
    <form
      className={"d-flex align-items-stretch mb-4 mb-md-0 " + className}
      role="search"
      action="https://www.google.com/search"
      onSubmit={handleSubmit}>
      <div className="input-group border-bottom border-dark border-2">
        <input className="form-control border-0 outline-0 shadow-0 no-clear-control text-dark fw-light ps-0" type="search" placeholder="Search Documentation" aria-label="Search Documentation" name="q" required/>
        <button className="btn btn-outline-light text-dark bg-transparent border-0 outline-0" type="submit" >
          <i className="bi bi-search"></i>
          <span className="visually-hidden">submit</span>
        </button>
      </div>
    </form>
  );
}
