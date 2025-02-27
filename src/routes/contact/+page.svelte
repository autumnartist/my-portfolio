<svelte:head>
  <title>Contact Me</title>
</svelte:head>

<body style="max-width:100ch; margin-inline: max(1em, (100% - 100ch) / 2)">
    <h1>Contact</h1>
    <form class="contactFields" action="mailto:arartist@mit.edu">
        <label class="contactLabel">
            Subject: <input name="subject" type="text">
        </label>
        <label class="contactLabel">
            Body: <textarea name="body"></textarea>
        </label>
        <button class="contactLabel contactSubmitButton">Submit</button>
    </form>
</body>