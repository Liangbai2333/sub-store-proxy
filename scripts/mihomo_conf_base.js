if ($options) {
  $options._res = {
    headers: {
      "profile-update-interval": 24,
      "content-disposition":
        "attachment; filename*=UTF-8''" + encodeURIComponent($file.displayName),
    },
  };
}
